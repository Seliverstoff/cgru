#include "name_af.h"

#include "../include/afjob.h"

#ifndef WINNT
#include <arpa/inet.h>
#else
#include <winsock.h>
#endif

#include "environment.h"
#include "farm.h"

af::Farm* ferma = NULL;

#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

bool af::init( uint32_t flags)
{
   AFINFO("af::init:\n");
   if( flags & InitFarm)
   {
      AFINFO("af::init: trying to load farm\n");
      if( loadFarm( flags & Verbose) == false)  return false;
   }
   return true;
}

const af::Farm * af::farm()
{
   return ferma;
}

bool af::loadFarm( bool verbose)
{
   QString filename = af::Environment::getAfRoot() + "/farm.xml";
   if( loadFarm( filename,  verbose) == false)
   {
      filename = af::Environment::getAfRoot() + "/farm_example.xml";
      if( loadFarm( filename,  verbose) == false) return false;
   }
   return true;
}

bool af::loadFarm( const QString & filename, bool verbose )
{
   af::Farm * new_farm = new Farm( filename);//, verbose);
   if( new_farm == NULL)
   {
      AFERROR("af::loadServices: Can't allocate memory for farm settings");
      return false;
   }
   if( new_farm->isValid())
   {
      if( ferma != NULL) delete ferma;
      ferma = new_farm;
      if( verbose) ferma->stdOut( true);
      return true;
   }
   delete new_farm;
   return false;
}

void af::destroy()
{
   if( ferma != NULL) delete ferma;
}

const QString af::time2Qstr( time_t time_sec)
{
   return QString( af::time2str(time_sec).c_str());
}

const std::string af::time2str( time_t time_sec, const char * time_format)
{
   static const int timeStrLenMax = 64;
   char buffer[timeStrLenMax];

   const char * format = time_format;
   if( format == NULL ) format = af::Environment::getTimeFormat();
   strftime( buffer, timeStrLenMax, format, localtime( &time_sec));
   return std::string( buffer);
}

const std::string af::time2strHMS( int time32, bool clamp)
{
   static const int timeStrLenMax = 64;
   char buffer[timeStrLenMax];

   int hours = time32 / 3600;
   time32 -= hours * 3600;
   int minutes = time32 / 60;
   int seconds = time32 - minutes * 60;

   std::string str;

   if( clamp )
   {
      if( hours )
      {
         sprintf( buffer, "%d", hours); str += buffer;
         if( minutes || seconds )
         {
            sprintf( buffer, ":%02d", minutes); str += buffer;
            if( seconds ) { sprintf( buffer, ".%02d", seconds); str += buffer;}
         }
         else str += "h";
      }
      else if( minutes )
      {
         sprintf( buffer, "%d", minutes); str += buffer;
         if( seconds ) { sprintf( buffer, ".%02d", seconds); str += buffer;}
         else str += "m";
      }
      else if( seconds ) { sprintf( buffer, "%ds", seconds); str += buffer;}
      else str += "0";
   }
   else
   {
      sprintf( buffer, "%d:%02d.%02d", hours, minutes, seconds);
      str += buffer;
   }

//   if( clamp == false)  return QString("%1:%2.%3").arg( hours  ).arg( minutes, 2, 10, z).arg( seconds, 2, 10, z);
//   if(hours && minutes) return QString("%1:%2"   ).arg( hours  ).arg( minutes, 2, 10, z);
//   if( minutes )        return QString("%1.%2"   ).arg( minutes).arg( seconds, 2, 10, z);
//   else                 return QString("%1"      ).arg( seconds);

   return str;
}

const QString af::state2str( int state)
{
   QString str;
   if( state & AFJOB::STATE_READY_MASK    ) str += QString("%1 ").arg( AFJOB::STATE_READY_NAME_S   );
   if( state & AFJOB::STATE_RUNNING_MASK  ) str += QString("%1 ").arg( AFJOB::STATE_RUNNING_NAME_S );
   if( state & AFJOB::STATE_DONE_MASK     ) str += QString("%1 ").arg( AFJOB::STATE_DONE_NAME_S    );
   if( state & AFJOB::STATE_ERROR_MASK    ) str += QString("%1 ").arg( AFJOB::STATE_ERROR_NAME_S   );
   return str;
}

void af::printTime( time_t time_sec, const char * time_format)
{
   std::cout << time2str( time_sec, time_format);
}

bool af::setRegExp( QRegExp & regexp, const QString & str, const QString & name)
{
   QRegExp rx( str);
   if( rx.isValid() == false )
   {
      AFERRAR("af::setRegExp: Setting '%s' to '%s' Invalid pattern: %s\n",
              name.toUtf8().data(), str.toUtf8().data(), rx.errorString().toUtf8().data());
      return false;
   }
   regexp.setPattern( str);
   return true;
}

void af::filterFileName( QString & filename)
{
   static const char InvalidCharacters[] = "\"\\ /|!$&?()[]{}*^`',:;";
   static const char ReplaceCharacter = '_';
   static const char InvCharsLength = strlen( InvalidCharacters);

   for( int c = 0; c < InvCharsLength; c++)
      filename.replace( InvalidCharacters[c], ReplaceCharacter);

   if( filename.size() > af::Environment::getFileNameSizeMax()) filename.resize( af::Environment::getFileNameSizeMax());
}

void af::rw_int32( int32_t& integer, char * data, bool write)
{
   int32_t bytes;
   if( write)
   {
      bytes = htonl( integer);
      memcpy( data, &bytes, 4);
   }
   else
   {
      memcpy( &bytes, data, 4);
      integer = ntohl( bytes);
   }
}

void af::rw_uint32( uint32_t& integer, char * data, bool write)
{
   uint32_t bytes;
   if( write)
   {
      bytes = htonl( integer);
      memcpy( data, &bytes, 4);
   }
   else
   {
      memcpy( &bytes, data, 4);
      integer = ntohl( bytes);
   }
}

const QString af::fillNumbers( const QString & pattern, int start, int end)
{
   QString str( pattern);
   if( str.contains("%1")) str = str.arg( start);
   if( str.contains("%2")) str = str.arg( end);
   if( str.contains("%") && (false == str.contains("%n"))) str.sprintf( str.toUtf8().data(), start, end);
   return str;
}

int af::weigh( const QString & str)
{
   return str.size() + 1;
}

int af::weigh( const QRegExp & regexp)
{
   return regexp.pattern().size() + 1;
}
